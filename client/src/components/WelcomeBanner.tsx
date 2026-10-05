import { CardHeader, CardTitle, Card } from "./ui/card"

type WelcomeBannerProps = {
  name: string
}

function WelcomeBanner(props: WelcomeBannerProps) {
  const { name } = props;
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>
          Welcome back, {name}
        </CardTitle>
      </CardHeader>
      {/* <CardContent>
        <p className="text-sm text-muted-foreground">
          You have {courseCount} courses in progress.
        </p>
      </CardContent> */}
    </Card>
  )
}

export default WelcomeBanner